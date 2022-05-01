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
    setSearchContext: (searchContext: {
        searchTerm?: string;
        searchResults?: any[];
        page?: number;
    }) => {},
});

interface SearchProviderProps {
    children?: React.ReactNode;
}

export const SearchStateProvider = (props: SearchProviderProps) => {
    const client = useApolloClient();
    const router = useRouter();

    const createSearchVars = (context: SearchMachineContext) => {
        const filters = [
            ...groupAndMapFilters(context.activeFilters),
            ...resolveClientSideDefaultFilters(config, locationData),
        ];
        const varPageSize = context.entityType === EntityType.BEVERAGES ? 10 : 20;
        const pageOffset =
            context.searchType === SearchType.REPLACE
                ? 0
                : context.page * varPageSize;
        const pageSize =
            context.searchType === SearchType.REPLACE
                ? (context.page + 1) * varPageSize
                : varPageSize;
        const queryData = queryVariables[context.entityType];
        if (context.entityType === EntityType.SEARCH) {
            queryData.variables = {
                searchQuery: {
                    search: context.searchTerm,
                    aggSizes: FILTER_AGGS,
                    filters,
                    page: {
                        offset: pageOffset,
                        size: pageSize,
                    },
                    sort: context.sort,
                },
            };
            if (locationData && locationData.lat && locationData.lon) {
                queryData.variables.searchQuery.geoPoint = {
                    lat: locationData?.lat,
                    lon: locationData?.lon,
                };
            }
        } else {
            queryData.variables = {
                [VariablesNames[context.entityType]]: {
                    identifier: {
                        entityUuid: context.entityId as string,
                    },
                    query: {
                        filters,
                        page: {
                            offset: pageOffset,
                            size: pageSize,
                        },
                        sort: context.sort,
                    },
                },
            };
            if (locationData && locationData.lat && locationData.lon) {
                queryData.variables[
                    VariablesNames[context.entityType]
                    ].query.geoPoint = { lat: locationData?.lat, lon: locationData?.lon };
            }
        }
        return queryData;
    };

    const doRunSearch = (context: SearchMachineContext) => {
        const queryData = createSearchVars(context);

        return Promise.all([
            client
                .query<Query, QuerySearchArgs | QueryArgs>({
                    query: queryData.query,
                    variables: queryData.variables,
                })
                .catch((error: ApolloError) => {
                    searchService.send({ type: "SEARCH_ERROR", error: error });
                }),
        ]).then((results) => {
            const dataField = queryVariables[context.entityType].dataField;
            if (queryData.entityKey && context.entityType !== EntityType.SEARCH) {
                const responseData = (results[0] as ApolloQueryResult<Query>).data[
                    dataField
                    ] as any;
                const collectionData =
                    (results[1] as ApolloQueryResult<Query>).data?.getCollectionsForEntity
                        ?.collections || [];
                return {
                    entityMatchData: responseData[queryData.entityKey],
                    page: responseData.results.page,
                    totalResults: responseData.results.totalResults,
                    buyingModalities: responseData.buyingModalities,
                    similar: responseData.similar,
                    curatedPix: collectionData,
                };
            }
            return (results[0] as ApolloQueryResult<Query>).data[dataField] as any;
        });
    };

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
