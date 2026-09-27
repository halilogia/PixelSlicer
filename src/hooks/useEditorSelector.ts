// Presentation Layer - Selector based ViewModel subscription
// Lets a component re-render only when the slice it reads actually changes.

import { useEffect, useReducer, useRef } from 'react';
import type { EditorState, EditorViewModel } from '@presentation/EditorViewModel';

type Equality<T> = (a: T, b: T) => boolean;

const strictEqual = <T,>(a: T, b: T): boolean => Object.is(a, b);

/** Shallow compare for state slices that are small objects. */
export function shallowEqual<T extends Record<string, unknown>>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (!a || !b) return false;

  const keys = Object.keys(a) as Array<keyof T>;
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every(key => Object.is(a[key], b[key]));
}

export function useEditorSelector<T>(
  viewModel: EditorViewModel,
  select: (state: EditorState) => T,
  isEqual: Equality<T> = strictEqual
): T {
  // The selector may be an inline arrow function, so it is kept in a ref and
  // only re-read on every notification instead of re-subscribing.
  const selectRef = useRef(select);
  selectRef.current = select;

  const isEqualRef = useRef(isEqual);
  isEqualRef.current = isEqual;

  const selectedRef = useRef<T>(select(viewModel.getState()));
  const [, forceRender] = useReducer((count: number) => count + 1, 0);

  useEffect(() => {
    // A change that happened between render and subscription must be caught.
    const sync = () => {
      const next = selectRef.current(viewModel.getState());
      if (isEqualRef.current(selectedRef.current, next)) return;
      selectedRef.current = next;
      forceRender();
    };

    sync();
    return viewModel.subscribe(sync);
  }, [viewModel]);

  return selectedRef.current;
}
