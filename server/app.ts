import AuthenticatingConcept from "./concepts/authenticating";
import CollaboratingConcept from "./concepts/collaborating";
import FriendingConcept from "./concepts/friending";
import InvitingConcept from "./concepts/inviting";
import PostingConcept from "./concepts/posting";
import SessioningConcept from "./concepts/sessioning";

// The app is a composition of concepts instantiated here
// and synchronized together in `routes.ts`.
export const Sessioning = new SessioningConcept();
export const Authing = new AuthenticatingConcept("users");
export const Posting = new PostingConcept("posts");
export const Friending = new FriendingConcept("friends");
export const Collaborating = new CollaboratingConcept("collaborations");
export const Inviting = new InvitingConcept("invites");
