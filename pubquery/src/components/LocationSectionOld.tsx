import { useState } from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"
import type { Pub } from '../types/Pub'
import PubCard from "./PubCard"
import PubModal from "./PubModal"
import { Beer } from "lucide-react";

type Props = {
  location: string
  pubs: Pub[]
}

function DummyPubCard() {
  return (
    <div className="
      bg-white text-gray-400 rounded-xl shadow-md p-4 min-h-[195px]
      flex items-center justify-center
      border border-dashed border-gray-300
    ">
      Inga pubar för tillfället
    </div>
  )
}

export default function LocationSection({ location, pubs }: Props) {
  const [modalPub, setModalPub] = useState<Pub | null>(null)

  return (
    <div className="mb-10 relative px-4 md:px-24">
     <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground mb-2">
        <Beer size={28} color="#1fbad6" className="shrink-0" />
        {location}
      </h2>

      <Carousel className="w-full" opts={{ align: "start", loop: false }}>
        <CarouselContent className="-ml-2 md:-ml-4">
          {pubs.length === 0 ? (
            <CarouselItem className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
              <div className="p-1">
                <DummyPubCard />
              </div>
            </CarouselItem>
          ) : (
            pubs.map((pub) => (
              <CarouselItem
                key={pub.event_id}
                className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3"
              >
                <div className="p-1">
                  <PubCard
                    pub={pub}
                    onClick={() => setModalPub(pub)}
                  />
                </div>
              </CarouselItem>
            ))
          )}
        </CarouselContent>

        <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10 shadow-md bg-white/80 hover:bg-white" />
        <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10 shadow-md bg-white/80 hover:bg-white" />
      </Carousel>
      
      <PubModal pub={modalPub} open={!!modalPub} onClose={() => setModalPub(null)} />
    </div>
  )
}
