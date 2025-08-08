
type StatusLabelProps = { text: string; emoji: string; color: string }
export function StatusLabel({ text, emoji, color }: StatusLabelProps) {
  return (
    <span className="flex items-center gap-1 font-medium">
      <span className={color}>{emoji}</span>
      <span>{text}</span>
    </span>
  )
}
