import React, { createContext, useCallback, useEffect } from "react";
import { useInterpret } from "@xstate/react";
import { InterpreterFrom } from "xstate";
import {
    searchMachine,
    SearchMachineContext,
    SearchType,
    SearchTypestate,
} from "../machines/searchMachine";
import { useRouter } from "next/router";
import useAxios from "axios-hooks";

export const resultsSelector = (state: SearchTypestate) => {
    return state.context.searchResults;
};
export const loadingSelector = (state: SearchTypestate) => {
    return state.context.loading;
};
export const errorSelector = (state: SearchTypestate) => {
    return state.context.error;
};
export const searchTermSelector = (state: SearchTypestate) => {
    return state.context.searchTerm;
};
export const pageNumSelector = (state: SearchTypestate) => {
    return state.context.page;
};
export const SearchStateContext = createContext({
    searchService: {} as InterpreterFrom<typeof searchMachine>,
    runSearch: (
        searchTerm?: string,
        page?: number,
    ) => {},
    runPage: (pageNum?: number) => {},
});

interface SearchProviderProps {
    children?: React.ReactNode;
}

const options = {
    method: 'GET',
    url: 'https://demotivational-quotes.p.rapidapi.com/api/quotes/all',
    headers: {
        'X-RapidAPI-Host': 'demotivational-quotes.p.rapidapi.com',
        'X-RapidAPI-Key': '537efa8ffemsh9337946a5d4e116p1c9148jsnb1553b92d823'
    }
};

export const SearchStateProvider = (props: SearchProviderProps) => {
    const router = useRouter();
    const [
        { data, loading: wordsLoading, error: wordsError },
        executeWordSearch
    ] = useAxios(
        options,
        { manual: true }
    )

    async function doRunSearch(context: SearchMachineContext) {
        const data = await executeWordSearch();
        console.debug("doRunSearch, data: ", data);
        return data;
    };
    useEffect(() => {
        console.debug("data: ", data);
    }, [data])
    useEffect(() => {
        console.debug("wordsLoading: ", wordsLoading);
    }, [wordsLoading])
    useEffect(() => {
        console.debug("wordsError: ", wordsError);
    }, [wordsError])

    const searchService = useInterpret(searchMachine, {
        devTools: false,
        services: { doRunSearch },
    });
    useEffect(() => {
        if (searchService?.state?.matches("error")) {
            searchService.send({ type: "RESET" });
        }
    }, [searchService]);

    const runSearch = useCallback(
        (
            searchTerm?: string,
            page?: number
        ) => {
            searchService.send({
                type: "RUN_SEARCH",
                searchTerm: searchTerm,
                page: page,
            });
        },
        [searchService]
    );

    const runPage = useCallback(
        (pageNum?: number) => {
            searchService.send({
                type: "RUN_PAGE",
                page: pageNum,
            });
        },
        [searchService]
    );

    return (
        <SearchStateContext.Provider
            value={{
                searchService,
                runSearch,
                runPage,
            }}
        >
            {props.children}
        </SearchStateContext.Provider>
    );
};
