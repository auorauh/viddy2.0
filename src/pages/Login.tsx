import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const Login = () => {
    const navigate = useNavigate();
    const [userEmail, setUserEmail] = useState('');
    const [userPassword, setPassword] = useState("");
    const [profile, setProfile] = useState({
        name: "Mike Richy",
        email: "alex.johnson@example.com",
        bio: "Content creator focused on skateboarding tutorials and lifestyle vlogs. Passionate about teaching others and building community through video.",
        joinDate: "October 2024",
        totalScripts: 64,
        totalRecordings: 18,
        subscription: "Pro Plan",
        subscriptionStatus: "Active",
        nextBilling: "March 15, 2024",
        interests: ["Technology", "Lifestyle", "Education"],
        platform: "YouTube",
        uploadRate: 8,
        uploadRatePeriod: "month" as "day" | "week" | "month" | "year",
        points: 750,
        level: 8,
        customLogo: null as string | null,
      });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const userInfo = profile
        userInfo.email = userEmail;
        //  call GET user here - password validation if success then run navigate
        navigate("/", { state: { userInfo } });
    }

  return (
    <div className="flex min-h-screen items-center justify-center bg-studio-bg">
      <Card className="w-full max-w-sm shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button className="w-full">Sign In</Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            Don’t have an account?{" "}
            <a href="/signup" className="text-yellow-200 hover:underline">
              Sign up
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default Login
