import { useState } from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'

type LinkProps = {
  href: string
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
  className?: string
  title?: string
  'aria-label'?: string
}

type LocationSectionProps<T> = {
  location: string | React.ReactNode
  items: T[]
  renderCard: (item: T, openModal: () => void) => React.ReactNode
  /** Provide ONLY when you want router-based navigation. If present, local modal is disabled. */
  getLinkProps?: (item: T) => LinkProps
  /** Local modal renderer (used only when getLinkProps is NOT provided) */
  renderModal?: (item: T | null, open: boolean, onClose: () => void) => React.ReactNode
  /** Optional stable key extractor (fallback: index) */
  getKey?: (item: T, index: number) => string | number
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
  getLinkProps,
  renderModal,
  getKey,
  emptyText = 'Inga event för tillfället',
  icon,
  button,
}: LocationSectionProps<T>) {
  // Local modal state is only meaningful when NOT using router links
  const [modalItem, setModalItem] = useState<T | null>(null)
  const usingLinks = typeof getLinkProps === 'function'

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
            items.map((item, i) => {
              const key = getKey ? getKey(item, i) : i
              const openModal = usingLinks ? () => {} : () => setModalItem(item)
              const card = <div className="p-1">{renderCard(item, openModal)}</div>

              if (usingLinks) {
                const link = getLinkProps!(item)
                return (
                  <CarouselItem key={key} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                    <a
                      href={link.href}
                      onClick={link.onClick}
                      className={link.className ?? 'block'}
                      title={link.title}
                      aria-label={link['aria-label']}
                    >
                      {card}
                    </a>
                  </CarouselItem>
                )
              }

              // Local modal mode
              return (
                <CarouselItem key={key} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  {card}
                </CarouselItem>
              )
            })
          )}
        </CarouselContent>

        <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10 shadow-md bg-white/80 hover:bg-white" />
        <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10 shadow-md bg-white/80 hover:bg-white" />
      </Carousel>

      {/* Only render local modal when not using router links */}
      {!usingLinks && renderModal && renderModal(modalItem, !!modalItem, () => setModalItem(null))}
    </div>
  )
}
