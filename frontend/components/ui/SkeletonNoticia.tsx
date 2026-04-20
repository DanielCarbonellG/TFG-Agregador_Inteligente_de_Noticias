export default function SkeletonNoticia() {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl animate-pulse">
      <div className="flex gap-2 mb-4">
        <div className="h-4 w-20 bg-slate-800 rounded-full"></div>
        <div className="h-4 w-24 bg-slate-800 rounded-full"></div>
      </div>
      <div className="h-8 w-3/4 bg-slate-800 rounded mb-4"></div>
      <div className="space-y-2 mb-6">
        <div className="h-4 w-full bg-slate-800 rounded"></div>
        <div className="h-4 w-full bg-slate-800 rounded"></div>
        <div className="h-4 w-5/6 bg-slate-800 rounded"></div>
      </div>
      <div className="flex justify-between">
        <div className="h-8 w-32 bg-slate-800 rounded-full"></div>
        <div className="h-8 w-24 bg-slate-800 rounded-full"></div>
      </div>
    </div>
  );
}