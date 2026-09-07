import type { ResumeLibrary } from "./resume-library";
export type LibraryState = {
  library: ResumeLibrary;
  past: ResumeLibrary[];
  future: ResumeLibrary[];
  ready: boolean;
  groupAt: number;
};
export type LibraryAction =
  | { type: "load"; library: ResumeLibrary }
  | {
      type: "edit";
      update: (library: ResumeLibrary) => ResumeLibrary;
      at: number;
      group: boolean;
    }
  | { type: "undo" }
  | { type: "redo" };
export function libraryReducer(
  state: LibraryState,
  action: LibraryAction,
): LibraryState {
  if (action.type === "load")
    return {
      ...state,
      library: action.library,
      past: [],
      future: [],
      ready: true,
      groupAt: 0,
    };
  if (action.type === "undo") {
    const last = state.past.at(-1);
    return last
      ? {
          ...state,
          library: last,
          past: state.past.slice(0, -1),
          future: [state.library, ...state.future],
          groupAt: 0,
        }
      : state;
  }
  if (action.type === "redo") {
    const next = state.future[0];
    return next
      ? {
          ...state,
          library: next,
          past: [...state.past, state.library],
          future: state.future.slice(1),
          groupAt: 0,
        }
      : state;
  }
  const library = action.update(state.library);
  if (
    library === state.library ||
    JSON.stringify(library) === JSON.stringify(state.library)
  )
    return state;
  return {
    ...state,
    library,
    past:
      action.group && action.at - state.groupAt < 650
        ? state.past
        : [...state.past, state.library].slice(-40),
    future: [],
    groupAt: action.group ? action.at : 0,
  };
}
