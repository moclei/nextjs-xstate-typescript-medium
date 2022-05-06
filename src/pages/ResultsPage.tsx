import React, { useContext, useEffect } from "react";
import { useRouter } from "next/router";
import { useSelector } from "@xstate/react";
import { resultsSelector, loadingSelector, searchTermSelector, SearchStateContext } from "../services/useSearch";
import styles from '../../styles/Results.module.css'

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

    const handleNewSearch = (value: string) => {
        searchContext.runSearch(value);
    };

    useEffect(() => {
        console.debug("ResultsPage, results: ", results);
    }, [results])

    const renderZeroResultsCard = () => {
        return !loading ? (
            <div className={styles.zeroResultsCard}>
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
            {/*<PixHeader />*/}
            <div  style={{marginBottom: "200px"}}>
                {!results ?
                    (
                        <div style={{display: "flex", flexDirection: "column"}}>
                            <div>No results</div>
                            <input type={"button"} onClick={() => searchContext.runSearch("")}/>
                        </div>
                    )
                    :
                    (<>
                        <div className={styles.resultsTitleContainer}>
                            {results?.length > 0 && (
                                <div className={styles.resultsTitleText}>
                                We found {results.length} wine
                            {results?.length === 1 ? "" : "s"} matching “{searchTerm}”
                                </div>
                                )}
                        </div>
                        <div className={styles.resultsPage}>
                            {/*<ResultsCardList />*/}
                            {results?.length === 0 && renderZeroResultsCard()}
                        </div>
                    </>)
                }
            </div>
        </div>
    );
}
