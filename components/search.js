export function initSearch({ searchInput, searchClear, onSearch }) {
    searchInput.addEventListener('input', () => {
        const query = searchInput.value;
        searchClear.classList.toggle('visible', query.trim().length > 0);
        onSearch(query);
    });

    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.classList.remove('visible');
        onSearch('');
        searchInput.focus();
    });

    return {
        getQuery: () => searchInput.value,
        clear: () => {
            searchInput.value = '';
            searchClear.classList.remove('visible');
            onSearch('');
        }
    };
}