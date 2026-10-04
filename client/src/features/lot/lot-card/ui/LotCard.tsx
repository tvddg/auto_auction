import { useState, type CSSProperties, type ReactNode } from "react";

import { cn, useCountdown } from "@/shared/lib";
import { iconSources, type IconName } from "@/shared/ui";
import {
    formatBets,
    formatDay,
    formatMileage,
    formatPrice,
    formatRemaining,
    formatTime,
} from "../lib/format";
import cl from "./LotCard.module.css";

export type LotCardProps = {
    id: string;
    title: string;
    imageUrl: string;
    shortInfo: {
        year: number;
        mileage: number;
        gear: string;
    };
    price: number;
    betsAmount: number;
    inFeatured: boolean; // is this card featured by user?
} & ({
    status: 'active';
    remainingTime: number; // in ms, coverts to 'HH:MM:SS' on client
} | {
    status: 'upcoming';
    startDate: Date; // DateTime format
} | {
    status: 'sold';
    dealDate: Date; // Date of the deal
})

/** PNG как маска: иконка красится в цвет текста */
function TintedIcon({ name }: { name: IconName }) {
    return <span
        className={cl.icon}
        style={{ "--icon": `url(${iconSources[name]})` } as CSSProperties}
        aria-hidden
    />
}

function ActiveBadge({ remainingTime }: { remainingTime: number }) {
    const [deadline] = useState(() => Date.now() + remainingTime);
    const secondsLeft = useCountdown(deadline);

    return <span className={cn(cl.badge, cl.badgeActive)}>
        <TintedIcon name="grayClock" />
        {formatRemaining(secondsLeft)}
    </span>
}

export function LotCard(props: LotCardProps) {
    const { title, imageUrl, shortInfo, price, betsAmount, inFeatured } = props;

    let badge: ReactNode;
    let pricePrefix = "";
    let footer: ReactNode;

    switch (props.status) {
        case "active":
            badge = <ActiveBadge remainingTime={props.remainingTime} />;
            footer = <span className={cl.bets}>
                <TintedIcon name="bets" />
                {formatBets(betsAmount)}
            </span>;
            break;
        case "upcoming":
            // TODO: иконка календаря, когда появится в assets
            badge = <span className={cn(cl.badge, cl.badgeUpcoming)}>{formatDay(props.startDate)}</span>;
            pricePrefix = "от ";
            footer = <span className={cl.start}>Старт в {formatTime(props.startDate)}</span>;
            break;
        case "sold":
            badge = <span className={cn(cl.badge, cl.badgeSold)}>Продан</span>;
            footer = <span>{formatDay(props.dealDate)} · {formatBets(betsAmount)}</span>;
            break;
    }

    return <li className={cn(cl.item, props.status === "sold" && cl.sold)}>
        <article className={cl.card}>
            <div className={cl.media}>
                {imageUrl && <img className={cl.image} src={imageUrl} alt={title} loading="lazy" />}
                <span
                    className={cn(cl.featured, inFeatured && cl.featuredActive)}
                    aria-label={inFeatured ? "В избранном" : "Не в избранном"}
                >
                    ☆
                </span>
                {badge}
            </div>

            <h3 className={cl.title}>{title}</h3>
            <p className={cl.info}>
                {shortInfo.year} · {formatMileage(shortInfo.mileage)} · {shortInfo.gear}
            </p>
            <p className={cl.price}>{pricePrefix}{formatPrice(price)}</p>
            <div className={cl.footer}>{footer}</div>
        </article>
    </li>;
}
