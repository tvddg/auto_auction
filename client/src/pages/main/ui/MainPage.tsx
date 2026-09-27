import { Header } from "@/widgets/header"
import { LocationNotifications } from "@/widgets/location-notifications"

export function MainPage() {
    return <Header actions={<LocationNotifications />} />
}
