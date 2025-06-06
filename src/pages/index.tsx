import useSWR from "swr";
import Link from "next/link";

type Listing = {
  id: string;
  title: string;
  promoted: boolean;
  user: { id: string };
  trustScore: number;
};

async function fetcher(url: string) {
  const res = await fetch(url);
  return res.json();
}

export default function FeedPage() {
  const { data } = useSWR<{ success: boolean; data: Listing[] }>("/api/feed", fetcher);
  return (
    <div className="p-4 grid gap-4">
      {data?.data.map(listing => (
        <div key={listing.id} className="border p-2 rounded">
          <Link href={`/listing/${listing.id}`}>{listing.title}</Link>
          {listing.promoted && <span className="ml-2 text-sm text-yellow-500">PROMOTED</span>}
          <span className="ml-4 text-sm">Trust: {listing.trustScore.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}
