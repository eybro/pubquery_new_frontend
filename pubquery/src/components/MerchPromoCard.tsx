import { ShoppingBag } from "lucide-react"

type MerchPromoCardProps = {
  title: string
  image: string
  link: string
}

export default function MerchPromoCard({ title, image, link }: MerchPromoCardProps) {
  return (
    <div
      className="
        bg-white text-black rounded-xl shadow-md p-4
        flex flex-col transition-all duration-200
        hover:shadow-2xl hover:scale-[1.03] hover:z-10
        relative
      "
    >
      {/* Icon top-right */}
      <div className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white shadow">
        <ShoppingBag size={24} className="text-blue-600" />
      </div>

      {/* Product image with fixed aspect ratio */}
      <div className="w-full aspect-[4/3] mb-3 overflow-hidden rounded-lg">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Title */}
      <h3 className="font-bold text-lg">{title}</h3>

      {/* Button */}
      <div className="mt-auto pt-3">
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="
            inline-block w-full text-center px-3 py-2
            bg-blue-600 text-white rounded-lg font-semibold
            hover:bg-blue-700 transition
          "
        >
          Visa i webbshop
        </a>
      </div>
    </div>
  )
}
