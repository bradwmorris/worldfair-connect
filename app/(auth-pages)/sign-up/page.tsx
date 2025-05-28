import { Message } from "@/components/form-message";
import SignUpFormWithOAuth from "./SignUpFormWithOAuth";

export default async function Signup(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return <SignUpFormWithOAuth searchParams={searchParams} />;
}
