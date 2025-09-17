import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming 'cn' utility is available from this path
import Logo from "@/components/Logo";

export const MobileMenu = ({ isOpen, onClose }) => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    // No useEffect to keep as per original file provided, and no new useEffect code was specified in the outline.

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    onClick={onClose}
                />
            )}
            
            <div className={cn(
                "fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                {/* Close button only */}
                <div className="absolute top-6 right-6">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-900 hover:bg-gray-800"
                    >
                        <X className="w-4 h-4 text-white" />
                    </Button>
                </div>
            </div>
        </>
    );
};