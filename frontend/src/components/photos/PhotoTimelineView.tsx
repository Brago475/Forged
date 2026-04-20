import { groupByMonth, type ProgressPhoto } from './photosStorage'

export function PhotoTimelineView({
  photos,
  onPhotoClick,
}: {
  photos: ProgressPhoto[]
  onPhotoClick: (photo: ProgressPhoto) => void
}) {
  const groups = groupByMonth(photos)

  if (groups.length === 0) {
    return (
      <div className="bg-forged-surface border border-forged-border rounded-2xl p-8 text-center">
        <p className="text-sm font-bold text-forged-text mb-1">No photos yet</p>
        <p className="text-xs text-forged-text2">Track your visual progress over time</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map(group => (
        <div key={group.monthKey}>
          <p className="text-[10px] font-black text-forged-text2 uppercase tracking-widest mb-2">
            {group.monthLabel}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {group.photos.map(photo => (
              <button
                key={photo.id}
                onClick={() => onPhotoClick(photo)}
                className="bg-forged-surface border border-forged-border rounded-xl overflow-hidden
                  hover:border-forged-purple/40 active:scale-[0.98] transition-all text-left"
              >
                <div className="relative aspect-[3/4]">
                  <img src={photo.dataUrl} alt={photo.angle}
                    className="absolute inset-0 w-full h-full object-cover" />
                  {photo.weight != null && (
                    <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded">
                      <p className="text-[9px] text-white font-black tabular-nums">{photo.weight}</p>
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-[10px] font-black text-forged-purple uppercase">{photo.angle}</p>
                  <p className="text-[10px] text-forged-text2 mt-0.5">
                    {new Date(photo.date + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric'
                    })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}