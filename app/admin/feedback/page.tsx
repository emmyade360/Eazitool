import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE, hasAdminSession } from '@/lib/admin-auth';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { getFeedbackStore } from '@/lib/feedback-store';

export const dynamic = 'force-dynamic';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default async function AdminFeedbackPage() {
  const cookieStore = await cookies();
  const isAdmin = hasAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Eazitool admin</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Feedback inbox</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Sign in to review saved ratings, comments and visitor activity.</p>
          <AdminLoginForm />
        </section>
      </div>
    );
  }

  let feedback;
  try {
    feedback = await getFeedbackStore();
  } catch (error) {
    return <AdminMessage message={`Could not load feedback: ${error instanceof Error ? error.message : 'unknown storage error'}`} />;
  }

  const reviews = [...feedback.reviews]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 200);
  const visitors = new Map(feedback.visitors.map((visitor) => [visitor.id, visitor]));
  const averageRating = reviews.length
    ? (reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1)
    : '—';

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Eazitool admin</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Feedback inbox</h1>
          <p className="mt-2 text-sm text-slate-600">The latest 200 ratings and comments, with their returning-visitor context.</p>
        </div>
        <div className="flex gap-3 text-center">
          <Stat label="Feedback" value={String(reviews.length)} />
          <Stat label="Average rating" value={averageRating} />
          <Stat label="Visitors" value={String(visitors.size)} />
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No feedback has been submitted yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Feedback</th>
                <th className="px-5 py-3 font-semibold">Tool</th>
                <th className="px-5 py-3 font-semibold">Visitor</th>
                <th className="px-5 py-3 font-semibold">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {reviews.map((review) => {
                const visitor = visitors.get(review.visitorId);
                return (
                  <tr key={review.id} className="align-top">
                    <td className="max-w-sm px-5 py-4">
                      <p className="font-semibold text-amber-500">{'★'.repeat(review.rating)}<span className="text-slate-200">{'★'.repeat(5 - review.rating)}</span></p>
                      <p className="mt-1 whitespace-pre-wrap leading-6">{review.comment || 'No written comment.'}</p>
                      {review.userEmail && <p className="mt-2 text-xs text-slate-500">{review.userEmail}</p>}
                      <p className="mt-2 text-xs text-slate-400">{formatDate(review.createdAt)}</p>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800">{review.documentType}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600">
                      {visitor ? <><p>{visitor.id}</p><p className="mt-1 text-slate-400">IP tag: {visitor.ipHash.slice(0, 16)}</p></> : 'Not tracked'}</td>
                    <td className="px-5 py-4 text-xs leading-5 text-slate-600">
                      {visitor ? <><p>{visitor.visitCount} page visits</p><p>{visitor.lastPath || 'No page path recorded'}</p><p className="mt-1 text-slate-400">Last seen {formatDate(visitor.lastSeenAt)}</p></> : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white px-4 py-3"><p className="text-lg font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></div>;
}

function AdminMessage({ message }: { message: string }) {
  return <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6"><div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm leading-6 text-amber-800">{message}</div></div>;
}
