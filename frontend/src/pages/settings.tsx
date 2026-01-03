import SettingsView from "@/components/settings/settings-view";
import { User } from "@/lib/types";

interface SettingsPageProps {
    currentUser: User;
}

export default function SettingsPage({ currentUser }: SettingsPageProps) {
    return <SettingsView user={currentUser} />;
}
