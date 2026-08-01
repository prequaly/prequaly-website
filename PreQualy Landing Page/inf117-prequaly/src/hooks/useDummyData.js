/**
 * useDummyData — returns pre-aggregated data from all 30 dummy CSV datasets.
 * Data is pre-computed and baked in as a static module for instant loading.
 */
import { useMemo } from 'react'
import { DUMMY_DATA } from '../data/dummyDataset'

export function useDummyData() {
  // Wrap in useMemo so reference is stable; no loading needed
  const data = useMemo(() => DUMMY_DATA, [])
  return { data, loading: false }
}
