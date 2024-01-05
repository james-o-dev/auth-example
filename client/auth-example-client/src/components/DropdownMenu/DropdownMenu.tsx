import { useEffect, useRef } from 'react'

interface DropdownMenuProps {
  children: React.ReactNode
  options: DropdownMenuOption[]
  onSelect: (value: string) => void;
  opened: boolean;
  setOpened: (value: boolean) => void;
  rtl?: boolean
}
interface DropdownMenuOption {
  value: string;
  text: string;
}

const DropdownMenu = ({ children, options, onSelect, opened, setOpened, rtl }: DropdownMenuProps) => {
  const menuArea = useRef(null)

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscKeypress)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscKeypress)
    }
  })

  const handleOutsideClick = (e: MouseEvent) => {
    if (opened && menuArea.current && !(menuArea.current as HTMLDivElement).contains(e.target as Node)) {
      setOpened(false)
    }
  }

  const handleEscKeypress = (e: KeyboardEvent) => {
    if (opened && e.key === 'Escape') setOpened(false)
  }

  const onSelectInternal = (v: string) => {
    setOpened(false)
    onSelect(v)
  }

  const menuClassNames = 'absolute origin-top-left bg-white border border-gray-100 z-20 start-0 right-0 rounded-md shadow-lg'
  const menuItemClassNames = 'block px-4 py-2 w-fit text-sm text-gray-500 rounded-lg hover:bg-gray-50 hover:text-gray-700 text-nowrap'

  const menuItems = (
    <div className={menuClassNames}>
      {options.map(({ value, text }, index) => (
        <a key={index} href='#' onClick={() => onSelectInternal(value)} className={menuItemClassNames}>{text}</a>
      ))}
    </div>
  )

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className='relative' ref={menuArea}>
      {children}
      {opened && menuItems}
    </div>
  )
}

export default DropdownMenu