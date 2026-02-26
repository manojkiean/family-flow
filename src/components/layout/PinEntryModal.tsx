import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, AlertCircle, X } from 'lucide-react';
import { FamilyMember } from '@/types/family';

interface PinEntryModalProps {
    member: FamilyMember | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (member: FamilyMember) => void;
}

export function PinEntryModal({ member, isOpen, onClose, onSuccess }: PinEntryModalProps) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setPin('');
            setError(false);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (member && pin === member.pin) {
            onSuccess(member);
            onClose();
        } else {
            setError(true);
            setPin('');
        }
    };

    if (!member) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[320px] rounded-2xl p-6">
                <DialogHeader className="items-center pb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                        <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-xl font-display">Enter PIN</DialogTitle>
                    <p className="text-sm text-muted-foreground text-center">
                        Please enter the 4-digit PIN for <strong>{member.name}</strong>
                    </p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex justify-center">
                        <Input
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={4}
                            value={pin}
                            onChange={(e) => {
                                setPin(e.target.value);
                                setError(false);
                            }}
                            className="text-center text-2xl tracking-[1em] h-14 font-bold bg-muted/50 border-0"
                            autoFocus
                            placeholder="••••"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-destructive text-sm justify-center animate-shake">
                            <AlertCircle className="h-4 w-4" />
                            <span>Incorrect PIN. Try again.</span>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1 gradient-warm" disabled={pin.length < 4}>
                            Unlock
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
