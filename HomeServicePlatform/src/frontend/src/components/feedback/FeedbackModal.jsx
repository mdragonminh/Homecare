"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { StarIcon as StarSolid } from "@heroicons/react/24/solid"
import { XMarkIcon } from "@heroicons/react/24/outline"

export const FeedbackModal = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  title = "Phản hồi và Đánh giá",
  subtitle = "Giúp chúng tôi cải thiện dịch vụ",
  ratingLabel = "Bạn đánh giá như thế nào?",
  commentLabel = "Bình luận (tùy chọn)",
  commentPlaceholder = "Chia sẻ trải nghiệm của bạn...",
  submitButtonText = "Gửi đánh giá",
  maxCommentLength = 1000
}) => {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setRating(0)
      setHoverRating(0)
      setComment("")
      setIsSubmitting(false)
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Vui lòng chọn số sao đánh giá.")
      return
    }
    setIsSubmitting(true)
    try {
      await onSubmit(rating, comment || null)
      // Reset form after successful submit
      setRating(0)
      setComment("")
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
              <p className="text-blue-100 text-sm">{subtitle}</p>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-blue-100 hover:text-white transition-colors disabled:opacity-50"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8 space-y-6">
          {/* Star Rating */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-4">{ratingLabel}</label>
            <div className="flex justify-center gap-3">
              {Array.from({ length: 5 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setRating(i + 1)}
                  onMouseEnter={() => setHoverRating(i + 1)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                  disabled={isSubmitting}
                >
                  <StarSolid
                    className={`h-10 w-10 transition-colors ${
                      i < (hoverRating || rating) ? "text-amber-400" : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-gray-600 mt-3">
                {["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Xuất sắc"][rating]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">{commentLabel}</label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => {
                const value = e.target.value
                if (value.length <= maxCommentLength) {
                  setComment(value)
                }
              }}
              disabled={isSubmitting}
              className="block w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-50 disabled:opacity-50"
              placeholder={commentPlaceholder}
              maxLength={maxCommentLength}
            />
            <p className="text-xs text-gray-500 mt-2">{comment.length}/{maxCommentLength} ký tự</p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Đang gửi..." : submitButtonText}
          </button>
        </div>
      </div>
    </div>
  )
}
