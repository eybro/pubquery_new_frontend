import { useState } from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'

type LocationSectionProps<T> = {
  location: string | React.ReactNode
  items: T[]
  renderCard: (item: T, openModal: () => void) => React.ReactNode
  renderModal: (item: T | null, open: boolean, onClose: () => void) => React.ReactNode
  emptyText?: string
  icon?: React.ReactNode
  button?: React.ReactNode
}

function DummyCard({ emptyText }: { emptyText: string }) {
  return (
    <div
      className="
      bg-white text-gray-400 rounded-xl shadow-md p-4 min-h-[195px]
      flex items-center justify-center
      border border-dashed border-gray-300
    "
    >
      {emptyText}
    </div>
  )
}

export default function LocationSection<T>({
  location,
  items,
  renderCard,
  renderModal,
  emptyText = 'Inga event för tillfället',
  icon,
  button,
}: LocationSectionProps<T>) {
  const [modalItem, setModalItem] = useState<T | null>(null)

  return (
    <div className="mb-10 relative px-4 md:px-24">
      <div className="flex items-center justify-between mb-2">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          {icon}
          {location}
        </h2>
        {button && button}
      </div>
      <Carousel className="w-full" opts={{ align: 'start', loop: false }}>
        <CarouselContent className="-ml-2 md:-ml-4">
          {items.length === 0 ? (
            <CarouselItem className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
              <div className="p-1">
                <DummyCard emptyText={emptyText} />
              </div>
            </CarouselItem>
          ) : (
            items.map((item, i) => (
              <CarouselItem key={i} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                <div className="p-1">{renderCard(item, () => setModalItem(item))}</div>
              </CarouselItem>
            ))
          )}
        </CarouselContent>
        <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10 shadow-md bg-white/80 hover:bg-white" />
        <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10 shadow-md bg-white/80 hover:bg-white" />
      </Carousel>
      {renderModal(modalItem, !!modalItem, () => setModalItem(null))}
    </div>
  )
}
