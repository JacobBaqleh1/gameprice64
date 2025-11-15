import React from 'react';

type LizProps = {
    title?: string;
    children?: React.ReactNode;
};

export default function Liz({ title = 'Hi Liz. This is Jackie Daytona!', children }: LizProps) {
    return (
        <div className=' text-pink-700'>
            <h1>{title}</h1>
            {children}
        </div>
    );
}