# WIN staged feed deployment

1. Open the existing Apps Script project linked to the WIN feed. Replace only `WIN_Staged.gs` with the current file. The original full-feed handler must still be named `winLegacyGet(e)`; leave synchronization functions and triggers unchanged.
2. Save. Run `setupWINStationIndex` once from the editor and authorize Sheets and Drive access. It creates a private Drive snapshot and a six-hour refresh trigger; it does not delete or change WIN_Results. Check the execution log for sourceRows, indexedResults and stations.
3. Deploy > Manage deployments > edit the existing web app > New version > Deploy. Preserve its current public access configuration and URL.
4. Open the existing feed URL with `?mode=stations`. Expect schema 2, mode stations, sourceRows, indexedResults, generatedAt and stations, not schema 1 measurement pages. Reload win-water-map.html and choose Latest sampling date / freshness.
5. Historical station pages return selected-station results only. If source rows are sorted/deleted rather than appended, rebuild the snapshot before serving histories. If a rebuild fails, the previous snapshot is retained. The six-hour refresh may be adjusted separately from the existing sync schedule.

The browser now stops waiting on the station index after 25 seconds and offers explicit full-feed fallback instead of automatically starting another long download. Unknown sample dates remain unknown. Source row counts are separate from surface-water result counts; a snapshot is not proof that the upstream historical import is complete.
