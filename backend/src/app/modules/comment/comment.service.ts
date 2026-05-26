import ApiError from "../../../errors/api_error";
import { ITokenPayload } from "../../../interfaces/token";
import { User } from "../user/user.model";
import { IComment, ICommentPayload } from "./comment.interface";
import httpStatus from "http-status";
import { Comment } from "./comment.model";
import { Types } from "mongoose";
import { Post } from "../post/post.model";

const createComment = async (
  payload: ICommentPayload,
  token: ITokenPayload
) => {
  const { _id, email } = token;
  const user = _id ? await User.findById(_id) : await User.findOne({ email });
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found!");
  }
  const post = await Post.findOne({
    _id: payload.postId,
    isDeleted: { $ne: true },
  });
  if (!post) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Post not found!");
  }
  post.commentsCount = post.commentsCount + 1;
  await post.save();
  const commentData: Omit<IComment, "parentCommentId"> = {
    postId: new Types.ObjectId(payload.postId),
    userId: user._id,
    comment: payload.comment,
  };
  if (payload.parentCommentId) {
    (commentData as IComment).parentCommentId = new Types.ObjectId(
      payload.parentCommentId
    );
  }
  const res = await Comment.create(commentData);
  return res;
};

const getCommentsByPostId = async (postId: string) => {
  const post = await Post.findOne({ _id: postId, isDeleted: { $ne: true } });
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, "Post not found!");
  }

  // Single query fetches ALL comments for the post
  const allComments = await Comment.find({ postId })
    .populate("userId", "name email")
    .populate({ path: "likes" })
    .sort({ createdAt: 1 })
    .lean();

  // Build lookup map: id → comment node
  const commentMap = new Map<string, any>();
  for (const comment of allComments) {
    commentMap.set(comment._id.toString(), { ...comment, replies: [] });
  }

  // Assemble tree in-memory — no extra DB calls
  const roots: any[] = [];
  for (const comment of allComments) {
    const node = commentMap.get(comment._id.toString());
    if (!comment.parentCommentId) {
      roots.push(node);
    } else {
      const parent = commentMap.get(comment.parentCommentId.toString());
      if (parent) {
        parent.replies.push(node);
      }
    }
  }

  const totalComments = allComments.length;
  return { comments: roots, totalComments };
};

const toggleCommentLike = async (commentId: string, token: ITokenPayload) => {
  const { _id, email } = token;
  const user = _id ? await User.findById(_id) : await User.findOne({ email });
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found!");
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Comment not found!");
  }
  const post = await Post.findOne({
    _id: comment.postId,
    isDeleted: { $ne: true },
  });
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, "Post not found!");
  }

  const hasLiked = comment.likes?.includes(user._id);
  if (hasLiked) {
    comment.likes = comment.likes?.filter(
      (id) => id.toString() !== user._id.toString()
    );
  } else {
    comment.likes?.push(user._id);
  }
  await comment.save();
  return comment;
};

export const CommentService = {
  createComment,
  getCommentsByPostId,
  toggleCommentLike,
};