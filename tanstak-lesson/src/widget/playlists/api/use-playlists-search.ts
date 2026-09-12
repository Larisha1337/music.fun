import { useState } from "react";
import { useDebounce } from "./debounce/useDebounce.ts";

export const usePlaylistSearch = (delay = 400) => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, delay);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    return {
        page,
        setPage,
        search,
        debouncedSearch,
        handleSearchChange,
    };
};