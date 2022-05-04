export interface IItemService<T, U, V> {
	create(props: U): Promise<T>
	edit(id: number, props: V): Promise<T>
	delete(id: number): Promise<void>
	deleteByName?(name: string): Promise<void>
	getAll(): Promise<T[]>
	getOne(id: number): Promise<T>
}