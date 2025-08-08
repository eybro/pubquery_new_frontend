import { MapPin, Calendar, Ticket, CalendarClock, Users } from 'lucide-react'
import type { Dinner } from '../types/Dinner'
import { differenceInCalendarDays, isToday, isTomorrow } from "date-fns"
import { getOpenString } from "../utils/dateString"

type Props = {
    dinner: Dinner
    onClick?: () => void
}

function getAllowedGuestsString(code: string) {
  switch (code) {
    case "all_students": return "alla studenter";
    case "members": return "sektionsmedlemmar";
    case "members_plus_one": return "sektionsmedlemmar + 1 gäst";
    case "kmr": return "KMR-medlemmar";
    case "everyone": return "alla";
    default: return code;
  }
}

export default function DinnerCard({ dinner, onClick }: Props) {
    const eventTime = new Date(dinner.date)
    const signupTime = dinner.signup_date ? new Date(dinner.signup_date) : undefined
    const now = new Date()
    const isOpen = now >= eventTime

    const dateStr = eventTime.toLocaleDateString("sv-SE", {
        day: "numeric",
        month: "long",
    });
    const timeStr = eventTime.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });

    const signupDateStr = signupTime
        ? signupTime.toLocaleDateString("sv-SE", {
              day: "numeric",
              month: "long",
          })
        : "";

    const signupTimeStr = signupTime
        ? signupTime.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })
        : "";

    const signupClosed = signupTime && now > signupTime;

    return (
       <div
      className="
        bg-white text-black rounded-xl shadow-md p-4 min-h-[195px]
        flex flex-col transition-all duration-200
        hover:shadow-2xl hover:scale-[1.03] hover:z-10
        cursor-pointer
        relative
      "
      onClick={onClick}
    >
      {/* Logo or Beer icon at top right */}
      <div
        className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white shadow"
        style={{ overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {dinner.logo_url ? (
          <img
            src={dinner.logo_url}
            alt="Organisation Logo"
            className="object-contain w-10 h-10"
            draggable={false}
          />
        ) : (
          <Ticket size={28} className="text-blue-500" />
        )}
      </div>
            {/* Overline / subtitle */}
            <div className="text-xs uppercase tracking-wide font-semibold mb-1 text-blue-700">
                {dinner.display_name}
            </div>
            <h3 className="font-bold text-lg">{dinner.title}</h3>

            <div className="flex-1 flex flex-col justify-start">
                <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                    <MapPin size={14} /> {dinner.venue_name}
                </p>

                <div className="text-sm flex flex-col gap-1 mb-1">
                  <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{dateStr} kl {timeStr}</span>
                  </div>
                  {signupTime && (
                    <div className="flex items-center gap-1">
                      <CalendarClock size={14} />
                      {signupClosed ? (
                        <span className="text-red-500 font-semibold">Anmälan stängd</span>
                      ) : (
                        <span>
                          OSA innan {signupDateStr} {signupTimeStr && <span>kl {signupTimeStr}</span>}
                        </span>
                      )}
                    </div>
                  )}
                </div>

            </div>

            <div className="flex items-center gap-1 text-sm">
            <Users size={14} />
            <span>Öppen för {getAllowedGuestsString(dinner.allowed_guests)}</span>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-300 my-3" />

            {/* Footer always at the bottom */}
            <div>
            {isOpen ? (
              <p className="text-sm text-blue-700 italic mt-1 font-semibold">
                Pågår nu
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic mt-1">
                {isToday(eventTime)
                  ? getOpenString(eventTime, now)
                  : isTomorrow(eventTime)
                  ? "Imorgon"
                  : `Om ${differenceInCalendarDays(eventTime, now)} dagar`}
              </p>
            )}
          </div>
        </div>
    )
}
