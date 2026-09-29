import { useSortStore, type SortKey, type SortOrder } from '../model/sort.store'
import cl from './LotSort.module.css'

// TODO: заглушка — выбор сортировки пока не реализован
export function LotSort() {
    const sortStore = useSortStore();

    return <div className={cl.sortingContainer}>
        <select 
            className={cl.trigger} 
            defaultValue={sortStore.sortKey}
            onChange={(e) => sortStore.changeKey(e.target.value as SortKey)}
        >
            <option value="date">По дате публикации</option>
            <option value="cost">По стоимости</option>
            <option value="year">По году выпуска</option>
        </select>
        <select 
            className={cl.trigger} 
            defaultValue={sortStore.order}
            onChange={(e) => sortStore.changeOrder(e.target.value as SortOrder)}
        >
            <option value="desc">По убыванию</option>
            <option value="asc">По возрастанию</option>
        </select>
    </div>
    
}
