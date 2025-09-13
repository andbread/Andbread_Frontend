import { useState } from "react";
interface ToggleProps {
    enabled:boolean
    onClick: ()=> void
}
const ToggleButton = ({onClick,enabled}:ToggleProps) => {
    const [isEnabled, setIsEnabled] = useState(enabled)
    const handleClick = () => {
        setIsEnabled(!isEnabled); 
        onClick();                
    };
    return (
        <button onClick={handleClick}
        className={`relative inline-flex h-20 w-40 items-center rounded-full transition-colors ${
        isEnabled ? "bg-secondary-100" : "bg-gray-300"
      }`}
        ><span
        className={`inline-block h-16 w-16 transform rounded-full bg-white transition-transform ${
          isEnabled ? "translate-x-22" : "translate-x-2"
        }`}
      />
        </button>
    )
}
export default ToggleButton;