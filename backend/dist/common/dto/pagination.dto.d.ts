export declare class PaginationQueryDto {
    page: number;
    pageSize: number;
    search?: string;
}
export declare function buildPagination(query: PaginationQueryDto): {
    skip: number;
    take: number;
    page: number;
    pageSize: number;
};
