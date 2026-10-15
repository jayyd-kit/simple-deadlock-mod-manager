import {ReactNode, Ref} from "react";


function Button({children, onClick, ref}: { onClick?: () => void, children?: ReactNode, ref?: Ref<any> }) {
    return (
        <button ref={ref}
                className="bg-gray-700 hover:bg-gray-800 active:bg-black
                transition-colors duration-200 text-white p-1 px-2 rounded-3xl
                font-retail-demo font-bold outline-2 outline-black outline-offset-2"
                onClick={onClick}>{children}</button>
    )
}

export default Button;