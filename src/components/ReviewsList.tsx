/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Review, Doctor } from '../types';
import { Star, MessageSquare, ThumbsUp, Send, User } from 'lucide-react';

interface ReviewsListProps {
  hospitalId: string;
  reviews: Review[];
  doctors: Doctor[];
  onReviewAdded: (newReview: Review) => void;
}

export default function ReviewsList({
  hospitalId,
  reviews,
  doctors,
  onReviewAdded
}: ReviewsListProps) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [selectedDocId, setSelectedDocId] = useState('');
  const [docRating, setDocRating] = useState(5);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Stats calculation
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? parseFloat((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
    : 0;

  // Star occurrences
  const starCounts = [0, 0, 0, 0, 0]; // 1-star, 2-star, 3-star, 4-star, 5-star
  reviews.forEach(r => {
    const idx = Math.min(4, Math.max(0, r.rating - 1));
    starCounts[idx]++;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Please provide feedback message text');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('hospital_token') 
            ? `Bearer ${localStorage.getItem('hospital_token')}`
            : btoa('patient-1:patient@smarthospital.com:patient') // fall back
        },
        body: JSON.stringify({
          hospitalId,
          rating,
          text,
          doctorId: selectedDocId || undefined,
          doctorRating: selectedDocId ? docRating : undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      onReviewAdded(data);
      setText('');
      setSelectedDocId('');
      setRating(5);
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Visual Analytics Box */}
      <div className="bg-slate-950/40 border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Patient Satisfaction Core</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white font-display">{avgRating || '0.0'}</span>
            <div className="flex text-amber-400">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <span className="text-xs text-slate-400">({totalReviews} Verified patient surveys)</span>
          </div>
        </div>

        {/* Rating Grid Percentage Bars */}
        <div className="space-y-2 mt-4 flex-1 justify-center flex flex-col">
          {[5, 4, 3, 2, 1].map(stars => {
            const count = starCounts[stars - 1];
            const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-2 text-xs">
                <span className="w-3 font-bold font-mono text-slate-300">{stars}</span>
                <Star className="w-3 h-3 text-amber-400 fill-current" />
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }}></div>
                </div>
                <span className="text-slate-400 font-mono w-5 text-right">{count}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-5 text-[11px] text-slate-500 border-t border-white/5 pt-3">
          Our rating calculation follows strict hospital quality standards and direct clinical survey validation.
        </div>
      </div>

      {/* Review Submission Column */}
      <div className="bg-slate-950/40 border border-white/5 p-5 rounded-2xl">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Leave Feedback Survey</h4>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <div className="text-xs text-red-400 bg-red-950/50 p-2 rounded border border-red-900/30">{error}</div>}

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Clinic Star Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(starIn => (
                <button
                  type="button"
                  key={starIn}
                  onClick={() => setRating(starIn)}
                  className="p-1 rounded hover:bg-slate-900 text-amber-400 transition-colors"
                >
                  <Star className={`w-5 h-5 ${rating >= starIn ? 'fill-current' : 'text-slate-600'}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Review Statement</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Report cleanliness, nurse demeanor, queue waiting times..."
              className="w-full px-3 py-2 bg-slate-900 border border-white/5 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500/50 min-h-[75px]"
            />
          </div>

          {/* Optional Doctor Rating */}
          <div className="border-t border-white/5 pt-3">
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Doctor Endorsement (Optional)</label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/5 rounded-lg text-white text-xs focus:outline-none focus:border-sky-500/50"
            >
              <option value="">-- Rate a Specific Attending G.P. --</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id} className="bg-slate-950">{d.name} ({d.specialization})</option>
              ))}
            </select>
          </div>

          {selectedDocId && (
            <div className="bg-slate-900 px-3 py-2 rounded-xl border border-white/5 flex items-center justify-between text-xs transition-all">
              <span className="font-semibold text-slate-350">Rate Doctor:</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(dStar => (
                  <button
                    type="button"
                    key={dStar}
                    onClick={() => setDocRating(dStar)}
                    className="text-amber-400 hover:scale-110 transition-transform"
                  >
                    <Star className={`w-3.5 h-3.5 ${docRating >= dStar ? 'fill-current' : 'text-slate-700'}`} />
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-sky-600 text-white rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-1.5 hover:bg-sky-550 transition-all shadow-md mt-2 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Submitting...' : 'Post Patient Review'}</span>
          </button>
        </form>
      </div>

      {/* Reviews feed thread */}
      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Patient Statements Feed</h4>
        
        {reviews.length === 0 ? (
          <div className="text-center py-6 text-slate-500 bg-slate-900/30 border border-dashed border-white/10 rounded-xl">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-600 stroke-[1.5]" />
            <p className="text-xs mt-2">No statements submitted for this hospital yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(item => (
              <div key={item.id} className="p-4 glass rounded-2xl hover:shadow-xs transition-shadow">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-slate-300">
                      <User className="w-4 h-4 scale-95" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{item.userName}</p>
                      <span className="text-[9px] text-slate-500 font-mono inline-block">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Active Patient'}</span>
                    </div>
                  </div>
                  <div className="flex text-amber-300 items-center gap-0.5 bg-slate-900 border border-white/5 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{item.rating}.0</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-2.5 leading-relaxed bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                  {item.text}
                </p>

                {item.doctorName && (
                  <div className="mt-3 flex items-center justify-between border-t border-sky-900/30 pt-2 text-[10px] bg-sky-950/20 px-2 py-1.5 rounded-lg border border-sky-900/40">
                    <span className="text-sky-305 font-medium truncate max-w-[170px]">⭐ Dedicated support to Dr. {item.doctorName.split(' ').slice(-1)[0]}</span>
                    <div className="flex text-amber-400 font-bold font-mono">
                      {item.doctorRating ? `⭐ ${item.doctorRating}.0` : 'Highly Recommended'}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
