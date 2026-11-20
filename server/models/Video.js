import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        topic: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['Scripting', 'Filming', 'Editing', 'Published'],
            default: 'Scripting'
        }, 
        hooks: {
            type: [String],
            default: []
        },
        script: {
            type: String,
            default: ''
        },
        brollIdeas: {
            type: [String],
            default: []
        },
        visuals: [
      {
        caption: { type: String },
        imageUrl: { type: String },
      },
    ],
    }, {timestamps: true}
);

export default mongoose.model("Video", videoSchema);