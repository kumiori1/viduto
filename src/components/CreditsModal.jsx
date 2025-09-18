export const CreditsModal = ({ isOpen, onClose, onPurchaseComplete, darkMode = false }) => {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handlePurchaseCredits = async () => {
        setLoading(true);
        try {
            // Implement credit purchase
            toast.success('Credit purchase initiated! (Demo mode)');
            onPurchaseComplete();
        } catch (error) {
            console.error('Error purchasing credits:', error);
            toast.error('Error purchasing credits. Please try again.');
        } finally {
            setLoading(false);
        }
    };
};