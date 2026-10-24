export function PageLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" aria-busy="true" aria-label="กำลังโหลด">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-sage-100 border-t-sage-500" />
    </div>
  );
}
