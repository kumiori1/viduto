import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { X } from 'lucide-react';
import { toast } from "sonner";
import Logo from "@/components/Logo";

export const AuthModal = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  if (!isOpen) return null;

}