import { Message } from "@/components/form-message";
import SignInFormWithOAuth from "./SignInFormWithOAuth";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return <SignInFormWithOAuth searchParams={searchParams} />;
}
