import React, { useContext, useEffect } from "react";
import { PixBody, PixHeader } from "../components/search-component-web";
import { useRouter } from "next/router";
import ResultsCardList from "../components/Lists/ResultsCardList";
import { useSelector } from "@xstate/react";
import { resultsSelector, loadingSelector, searchTermSelector, SearchStateContext } from "../services/useSearch";
import styles from '../styles/Results.module.css'

export interface ResultsPageProps {
    serverData: {
        results: any;
        searchTerm: string;
    }
}

export default function ResultsPage({
                                        serverData,
                                    }: ResultsPageProps) {
    const router = useRouter();
    const searchContext = useContext(SearchStateContext);
    const results = useSelector(searchContext.searchService, resultsSelector);
    const loading = useSelector(searchContext.searchService, loadingSelector);
    const searchTerm = useSelector(searchContext.searchService, searchTermSelector);

    useEffect(() => {
        if (serverData.results) {
            searchContext.setSearchContext({
                results: serverData.results,
                searchTerm: serverData.searchTerm,
            });
        }
    }, [serverData.results]);

    const handleNewSearch = (value: string) => {
        searchContext.runSearch(value);
    };

    const renderZeroResultsCard = () => {
        return !loading ? (
            <div raised={false} className={styles.zeroResultsCard}>
                <div className={styles.resultsTitleText}>
                    Wanted: wines matching “{searchTerm}”
                </div>
                <div className={styles.resultsCardDescription}>
                    You just helped us uncover a gap in our wine library. But fear not,
                    our team of wine finders are on the case and you can be the first to
                    know when we find a match.
                </div>
            </div>
        ) : null;
    };

    return (
        <div className={styles.root}>
            <PixHeader />
            <PixBody
                role="main"
                ariaLabel="main filters and results"
                marginBottom="200px"
            >
                <div className={styles.resultsTitleContainer}>
                    {results.length > 0 && (
                        <div className={styles.resultsTitleText}>
                            We found {results.length} wine
                            {results.length === 1 ? "" : "s"} matching “{searchTerm}”
                        </div>
                    )}
                </div>
                <div className={styles.resultsPage}>
                    <ResultsCardList />
                    {results.length === 0 && renderZeroResultsCard()}
                </div>
            </PixBody>
        </div>
    );
}
