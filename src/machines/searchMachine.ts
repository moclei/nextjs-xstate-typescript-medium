import { assign, createMachine } from "xstate";

if (typeof window !== "undefined") {
    // Uncomment and set devTools to true in the hook to
    // see the debug inspector
    /*  inspect({
      iframe: false,
    });*/
}

enum PageStatus {
    UP = "UP",
    DOWN = "DOWN",
    NO_CHANGE = "NO_CHANGE",
}

export enum SearchType {
    APPEND,
    REPLACE,
}

export interface SearchMachineContext {
    searchTerm?: string;
    page: number;
    prevPage?: number;
    searchResults?: any[];
    error?: Error;
    loading?: boolean;
    pageStatus?: any;
    searchType?: SearchType;
}

type SearchStateEvents = {
    type: "RUN_SEARCH";
    searchTerm?: string;
    page?: number;
}

export type SearchTypestate =
    | {
    value: "idle";
    context: SearchMachineContext;
}
    | {
    value: "runningSearch";
    context: SearchMachineContext;
}
    | {
    value: "loading";
    context: SearchMachineContext;
}
    | {
    value: "error";
    context: SearchMachineContext;
};

export const searchMachine = createMachine<
    SearchMachineContext,
    any,
    SearchTypestate
    >(
    {
        id: "search",
        preserveActionOrder: true,
        schema: {
            context: {
                page: 0,
                prevPage: 0,
                loading: false,
                searchResults: []
            } as SearchMachineContext,
            events: {} as SearchStateEvents,
        },
        initial: "idle",
        states: {
            idle: {
                entry: ["notifyIdleEntry"],
                exit: ["notifyIdleExit"],
                on: {
                    RUN_SEARCH: {
                        target: ["searching"],
                        actions: [
                            assign({
                                searchType: (ctx, evt) => SearchType.REPLACE,
                            }),
                            assign({
                                searchTerm: (ctx, evt) => {
                                    return (
                                        evt.searchTerm || (evt.entityId ? null : ctx.searchTerm)
                                    );
                                },
                                page: (ctx, evt) => 0,
                            }),
                        ],
                    },
                    RUN_PAGE: {
                        target: ["searching"],
                        actions: [
                            assign({
                                searchType: (ctx, evt) => SearchType.APPEND,
                            }),
                            assign({
                                prevPage: (ctx, evt) => ctx.page,
                            }),
                            assign({
                                page: (ctx, evt) => evt.page || ctx.page + 1,
                            }),
                            assign({
                                pageStatus: (ctx, evt) => {
                                    const page = evt.page || ctx.page;
                                    const prevPage = (evt.page ? ctx.page : ctx.prevPage) || page;
                                    if (page > prevPage) {
                                        return PageStatus.UP;
                                    }
                                    if (page < prevPage) {
                                        return PageStatus.DOWN;
                                    }
                                    return PageStatus.NO_CHANGE;
                                },
                            }),
                        ],
                    },
                },
            },
            searching: {
                initial: "pending",
                states: {
                    pending: {
                        entry: [
                            "notifySearchPendingEntry",
                            assign({
                                loading: (ctx, evt) => true,
                            }),
                        ],
                        exit: ["notifySearchPendingExit"],
                        invoke: {
                            src: "doRunSearch",
                            onDone: {
                                target: "success",
                                actions: [
                                    assign({
                                        pageStatus: (ctx, evt) => {
                                            return evt.type === "done.invoke.doRunSearch"
                                                ? PageStatus.NO_CHANGE
                                                : ctx.pageStatus;
                                        },
                                    }),
                                    assign({
                                        searchResults: (ctx, evt) => {
                                            console.debug("doRunSearch, assigning searchResults");
                                            return ctx.searchType === SearchType.APPEND
                                                ? [...[ctx.searchResults || []], ...evt.data.page]
                                                : evt.data.page;
                                        },
                                        loading: (ctx, evt) => false,
                                    }),
                                ],
                            },
                            onError: {
                                target: "#search.error",
                            },
                        },
                    },
                    success: {
                        entry: ["notifySearchSuccessEntry"],
                        exit: ["notifySearchSuccessExit"],
                        always: [{ target: "#search.idle"}],
                    },
                },
            },
            error: {
                on: {
                    RESET: {
                        target: "#search.idle",
                    },
                },
            },
        },
    },
    {
        actions: {
            activate: (context, event) => {
               console.log("activating filters...");
            },
            notifyActive: (context, event) => {
               console.log("active!");
            },
            notifyTransition: (context, event) => {
               console.log("notifyTransition, evt: ", event);
            },
            notifyEntry: (context, event) => {
               console.log("notifyEntry, evt: ", event);
            },
            notifyExit: (context, event) => {
               console.log("notifyExit, evt: ", event);
            },
            notifyFiltersPendingEntry: (context, event) => {
               console.log("notifyFiltersPendingEntry, evt: ", event);
            },
            notifyFiltersPendingExit: (context, event) => {
               console.log("notifyFiltersPendingExit, evt: ", event);
            },
            notifyFiltersSuccessEntry: (context, event) => {
               console.log("notifyFiltersSuccessEntry, evt: ", event);
            },
            notifyFiltersSuccessExit: (context, event) => {
               console.log("notifyFiltersSuccessExit, evt: ", event);
            },

            notifySearchPendingEntry: (context, event) => {
               console.log("notifySearchPendingEntry, evt: ", event);
            },
            notifySearchPendingExit: (context, event) => {
               console.log("notifySearchPendingExit, evt: ", event);
            },
            notifySearchSuccessEntry: (context, event) => {
               console.log("notifySearchSuccessEntry, evt: ", event);
            },
            notifySearchSuccessExit: (context, event) => {
               console.log("notifySearchSuccessExit, evt: ", event);
            },
            notifyIdleEntry: (context, event) => {
               console.log("notifyIdleEntry, evt: ", event);
            },
            notifyIdleExit: (context, event) => {
               console.log("notifyIdleExit, evt: ", event);
            },
        },
        guards: {
            isSearchDone: (context, event) => {
                return context.loading === false;
            },
        },
    }
);
