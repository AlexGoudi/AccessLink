"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { StatusAnnouncer } from "@/components/status-announcer"
import { SkipLink } from "@/components/skip-link"
import Link from "next/link"
import { GoogleLoginButton } from "@/components/google-login-button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { apiClient } from "@/lib/api-client"

interface FormErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
  general?: string
}

interface UserProfile {
  displayName: string
  avatar: string | null
  language: string
  location: string
  accessibilityNeeds: string
  bio: string
}

export default function SignupForm() {
  // State
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  // Refs
  const nameInputRef = useRef<HTMLInputElement>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null)
  const submitButtonRef = useRef<HTMLButtonElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  // Hooks
  const router = useRouter()
  const { toast } = useToast()

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)

    // Try to load profile data
    try {
      const savedProfile = localStorage.getItem("userProfile")
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile)
        setProfile(parsedProfile)
        if (parsedProfile.displayName) {
          setName(parsedProfile.displayName)
        }
      }
    } catch (e) {
      console.error("Failed to load profile data", e)
    }
  }, [])

  // Focus first input on mount
  useEffect(() => {
    if (mounted) {
      nameInputRef.current?.focus()
    }
  }, [mounted])

  // Focus on first error when errors change
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      if (errors.name) {
        nameInputRef.current?.focus()
      } else if (errors.email) {
        emailInputRef.current?.focus()
      } else if (errors.password) {
        passwordInputRef.current?.focus()
      } else if (errors.confirmPassword) {
        confirmPasswordInputRef.current?.focus()
      } else if (errors.general) {
        errorRef.current?.focus()
      }
    }
  }, [errors])

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Name validation
    if (!name.trim()) {
      newErrors.name = "Name is required"
    }

    // Email validation
    if (!email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = "Password must contain at least one uppercase letter"
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = "Password must contain at least one lowercase letter"
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = "Password must contain at least one number"
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    // Terms agreement validation
    if (!agreeTerms) {
      newErrors.general = "You must agree to the Terms of Service and Privacy Policy"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      setStatusMessage("Form validation failed. Please correct the errors.")
      setTimeout(() => setStatusMessage(null), 3000)
      return
    }

    setIsLoading(true)
    setStatusMessage("Creating your account, please wait...")

    try {
      // Simulate API call
      const request_sign_up = await apiClient.signUp(email, name, password);
      if (request_sign_up.response == "false") {
        throw new Error("API call failed with server response:" + request_sign_up.response)
      }

      await new Promise((resolve) => setTimeout(resolve, 1500))

      // For demo purposes, let's just pretend we created the account
      // In a real app, you would make an API call to create the user account

      // Store user in localStorage for demo purposes
      const user = {
        name,
        email,
        createdAt: new Date().toISOString(),
      }

      // Get existing users or initialize empty array
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")

      // Check if email already exists
      if (existingUsers.some((u: any) => u.email === email)) {
        throw new Error("Email already in use")
      }

      // Add new user
      existingUsers.push(user)
      localStorage.setItem("users", JSON.stringify(existingUsers))

      // Update profile with the name if it's different
      if (profile && profile.displayName !== name) {
        const updatedProfile = { ...profile, displayName: name }
        localStorage.setItem("userProfile", JSON.stringify(updatedProfile))
      }

      toast({
        title: "Account created",
        description: "Your account has been created successfully. Please log in.",
      })

      setStatusMessage("Account created successfully. Redirecting to login page.")

      // Redirect to login page after successful signup
      setTimeout(() => {
        router.push("/")
      }, 1500)
    } catch (error) {
      console.error("Signup error:", error)

      setErrors({
        general: error instanceof Error ? error.message : "Failed to create account. Please try again.",
      })

      setStatusMessage("Failed to create account. Please try again.")
      setTimeout(() => setStatusMessage(null), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  // Toggle confirm password visibility
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  if (!mounted) return null

  return (
    <>
      <SkipLink />
      <StatusAnnouncer message={statusMessage} />

      <main
        id="main-content"
        className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4"
        tabIndex={-1}
      >
        <div className="w-full max-w-md">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center mb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push("/")}
                  aria-label="Back to login"
                  className="mr-2"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <CardTitle className="text-2xl">Create Account</CardTitle>
              </div>
              {profile && profile.avatar && (
                <div className="flex justify-center mb-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={profile.avatar || "/placeholder.svg"} alt="Your profile picture" />
                    <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xl">
                      {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              <CardDescription>Sign up for an Accessibility Assistant account</CardDescription>
            </CardHeader>

            {errors.general && (
              <div
                ref={errorRef}
                className="mx-6 mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
                role="alert"
                aria-live="assertive"
                tabIndex={-1}
              >
                <p className="font-medium">{errors.general}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <CardContent className="space-y-4">
                {/* Name field */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <Label htmlFor="name" className="text-base">
                      Full Name
                    </Label>
                    {errors.name && (
                      <span className="text-sm text-red-600 dark:text-red-400" id="name-error">
                        {errors.name}
                      </span>
                    )}
                  </div>
                  <Input
                    id="name"
                    ref={nameInputRef}
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    aria-invalid={errors.name ? "true" : "false"}
                    aria-describedby={errors.name ? "name-error" : undefined}
                    className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                    disabled={isLoading}
                    required
                    autoComplete="name"
                  />
                </div>

                {/* Email field */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <Label htmlFor="email" className="text-base">
                      Email
                    </Label>
                    {errors.email && (
                      <span className="text-sm text-red-600 dark:text-red-400" id="email-error">
                        {errors.email}
                      </span>
                    )}
                  </div>
                  <Input
                    id="email"
                    ref={emailInputRef}
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={errors.email ? "true" : "false"}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                    disabled={isLoading}
                    required
                    autoComplete="email"
                  />
                </div>

                {/* Password field */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <Label htmlFor="password" className="text-base">
                      Password
                    </Label>
                    {errors.password && (
                      <span className="text-sm text-red-600 dark:text-red-400" id="password-error">
                        {errors.password}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      ref={passwordInputRef}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-invalid={errors.password ? "true" : "false"}
                      aria-describedby={errors.password ? "password-error" : undefined}
                      className={`pr-10 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      disabled={isLoading}
                      required
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={togglePasswordVisibility}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Password must be at least 8 characters with uppercase, lowercase, and numbers
                  </p>
                </div>

                {/* Confirm Password field */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <Label htmlFor="confirmPassword" className="text-base">
                      Confirm Password
                    </Label>
                    {errors.confirmPassword && (
                      <span className="text-sm text-red-600 dark:text-red-400" id="confirm-password-error">
                        {errors.confirmPassword}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      ref={confirmPasswordInputRef}
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      aria-invalid={errors.confirmPassword ? "true" : "false"}
                      aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                      className={`pr-10 ${errors.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      disabled={isLoading}
                      required
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={toggleConfirmPasswordVisibility}
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      aria-pressed={showConfirmPassword}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox
                    id="terms"
                    checked={agreeTerms}
                    onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                    aria-required="true"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to the{" "}
                      <Link href="/terms" className="text-blue-600 hover:underline dark:text-blue-400">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy-policy" className="text-blue-600 hover:underline dark:text-blue-400">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button
                  ref={submitButtonRef}
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  // onClick={}
                  disabled={isLoading}
                  aria-busy={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-300 dark:border-slate-600"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-slate-800 px-2 text-slate-500 dark:text-slate-400">Or</span>
                  </div>
                </div>

                <GoogleLoginButton mode="signup" />

                <p className="text-center text-sm">
                  Already have an account?{" "}
                  <Link
                    href="/"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    Log in
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </>
  )
}
