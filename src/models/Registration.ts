import mongoose from "mongoose";

const ParticipantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  class: { type: String, required: true },
  contact: { type: String, required: true },
});

const RegistrationSchema = new mongoose.Schema({
  team: { type: String, required: true },
  event: { type: String, required: true },
  participants: [ParticipantSchema],
}, { timestamps: true });

export default mongoose.models.Registration || mongoose.model("Registration", RegistrationSchema);
