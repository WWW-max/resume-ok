"use client";

import { ResumeData } from "@/lib/resume-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, GitBranch, Globe, User, Briefcase } from "lucide-react";

interface BasicInfoFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

function FormField({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-white/60 text-xs font-medium flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </Label>
      {children}
    </div>
  );
}

// Larger touch targets on mobile (h-11 = 44px, meets WCAG minimum)
const inputCls =
  "bg-white/5 border-white/10 text-white placeholder:text-white/20 " +
  "focus:border-blue-500/50 focus:bg-white/8 transition-colors " +
  "text-sm h-11 md:h-9 rounded-lg touch-manipulation";

export function BasicInfoForm({ data, onChange }: BasicInfoFormProps) {
  const update = (key: keyof ResumeData, value: string) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="px-4 pb-8 space-y-5">
      {/* Avatar Upload */}
      <div
        className="flex flex-col items-center py-6 border border-dashed border-white/10 rounded-xl
                   bg-white/2 hover:border-blue-500/30 active:border-blue-500/40
                   transition-colors cursor-pointer group touch-manipulation"
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => update("avatar", reader.result as string);
              reader.readAsDataURL(file);
            }
          };
          input.click();
        }}
      >
        {data.avatar ? (
          <img
            src={data.avatar}
            alt="avatar"
            className="w-20 h-20 rounded-full object-cover border-2 border-blue-500/50 shadow-lg shadow-blue-500/20"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600/30 to-violet-600/30 border border-white/10 flex items-center justify-center group-hover:border-blue-500/30 transition-colors">
            <User className="w-8 h-8 text-white/30 group-hover:text-white/50 transition-colors" />
          </div>
        )}
        <p className="text-white/30 text-xs mt-2.5 group-hover:text-white/50 transition-colors">
          点击上传头像
        </p>
      </div>

      {/* Name & Title */}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="姓名" icon={User}>
          <Input
            className={inputCls}
            placeholder="张三"
            value={data.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </FormField>
        <FormField label="求职意向" icon={Briefcase}>
          <Input
            className={inputCls}
            placeholder="前端工程师"
            value={data.title}
            onChange={(e) => update("title", e.target.value)}
          />
        </FormField>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="手机号" icon={Phone}>
          <Input
            className={inputCls}
            placeholder="138-0000-0000"
            type="tel"
            inputMode="tel"
            value={data.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </FormField>
        <FormField label="邮箱" icon={Mail}>
          <Input
            className={inputCls}
            placeholder="email@example.com"
            type="email"
            inputMode="email"
            value={data.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </FormField>
      </div>

      <FormField label="所在城市" icon={MapPin}>
        <Input
          className={inputCls}
          placeholder="北京市"
          value={data.location}
          onChange={(e) => update("location", e.target.value)}
        />
      </FormField>

      <FormField label="GitHub" icon={GitBranch}>
        <Input
          className={inputCls}
          placeholder="github.com/username"
          inputMode="url"
          value={data.github}
          onChange={(e) => update("github", e.target.value)}
        />
      </FormField>

      <FormField label="个人网站" icon={Globe}>
        <Input
          className={inputCls}
          placeholder="https://yourwebsite.com"
          type="url"
          inputMode="url"
          value={data.website}
          onChange={(e) => update("website", e.target.value)}
        />
      </FormField>
    </div>
  );
}
