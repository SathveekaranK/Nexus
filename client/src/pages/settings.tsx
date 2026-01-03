import SettingsView from "@/components/settings/settings-view";
import { USERS, CURRENT_USER_ID } from "@/lib/data";

export default function SettingsPage() {
    const currentUser = USERS.find((u) => u.id === CURRENT_USER_ID)!;
    return <SettingsView user={currentUser} />;
}
