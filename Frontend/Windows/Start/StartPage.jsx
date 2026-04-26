import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Settings, Info, User, ChevronLeft } from 'lucide-react';
import { useAuth, TIER_COLORS } from '../../Core/logic/AuthCore';
import { useLocale } from '../../Locales';
import TierBadge from '../../Shared/TierBadge';
import { ExpandedProfileContent } from '../Auth/WelcomeScreen_Utils/ExpandedProfileContent';
import { notify } from '../../Shared/notificationCore_utils/notifications';
import { DeleteConfirmModal } from '../../Shared/ui/modal/DeleteConfirmModal';
import { ProjectEditModal } from '../../Shared/ui/modal/ProjectEditModal';
import TutorialOverlay from '../../Shared/TutorialOverlay';
import {
  PageBackground,
  HeroSection,
  DropZone,
  ProjectsSeparator,
  LoadingState,
  EmptyState,
  ProjectCard,
  Footer,
} from './StartPageStyle';

export default function StartPage({ onSelectFile, onFileDrop, onLoadProject, onSettingsOpen, onOpenHome, onboarding, onOnboardingUpdate, onTutorialComplete: onTutorialCompleteCallback }) {
  const t = useLocale();
  const auth = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);

  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const [exampleProject, setExampleProject] = useState(null);

  const handleToggleProfile = useCallback(() => {
    setIsProfileExpanded(v => !v);
  }, []);

  // Start tutorial when page finishes loading (only if not yet completed and welcome was already shown)
  useEffect(() => {
    if (!loading && onboarding && !onboarding.tutorialStartPage && onboarding.welcomeShown) {
      // Small delay so DOM elements are in place
      const timer = setTimeout(() => setShowTutorial(true), 600);
      return () => clearTimeout(timer);
    }
  }, [loading, onboarding]);

  // Tutorial step callbacks — create/remove example project, open/close profile
  const handleBeforeStep = useCallback((index, prevIndex) => {
    const goingForward = prevIndex === null || index > prevIndex;

    if (index === 1) {
      // Step 2 (projects-section) — ensure at least one project card is visible
      if (projects.length === 0 && !exampleProject) {
        setExampleProject({
          id: '__tutorial_example__',
          name: 'Example Mod',
          author: 'Tutorial',
          pakPath: 'ExampleMod.pak',
          lastModified: Date.now(),
          translatedCount: 12,
          totalCount: 48,
        });
        // Track the section while the card renders and animates in
        return { track: 400 };
      }
      // Going back from step 3: close profile and track collapse animation
      if (!goingForward) {
        setIsProfileExpanded(false);
        return { track: 550 };
      }
    } else if (index === 2) {
      // Step 3 (profile) — open profile; spotlight immediately uses ghost div's known dimensions
      setIsProfileExpanded(true);
      return 0;
    } else if (index === 0) {
      // Going back to step 1: remove example project and close profile
      setExampleProject(null);
      setIsProfileExpanded(false);
    } else {
      // Steps 4+ — collapse profile
      setIsProfileExpanded(false);
      // Going back from step 4+ to before step 2: remove example project
      if (!goingForward && index < 2) setExampleProject(null);
    }
    return 0;
  }, [projects.length, exampleProject]);

  const handleTutorialComplete = useCallback(() => {
    setShowTutorial(false);
    setExampleProject(null);
    setIsProfileExpanded(false);
    if (window.electronAPI?.onboardingUpdate) {
      window.electronAPI.onboardingUpdate({ tutorialStartPage: true });
    }
    if (onOnboardingUpdate) {
      onOnboardingUpdate(prev => ({ ...prev, tutorialStartPage: true }));
    }
    if (onTutorialCompleteCallback) {
      onTutorialCompleteCallback();
    }
  }, [onOnboardingUpdate, onTutorialCompleteCallback]);

  const fetchProjects = useCallback(async () => {
    if (!window.electronAPI) { setLoading(false); return; }
    const res = await window.electronAPI.loadProjects();
    if (res?.success) setProjects(res.projects);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!window.electronAPI) { if (!cancelled) setLoading(false); return; }
      const res = await window.electronAPI.loadProjects();
      if (cancelled) return;
      if (res?.success) setProjects(res.projects);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleDeleteRequest = (e, project) => {
    e.stopPropagation();
    setDeleteTarget(project);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !window.electronAPI) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    const res = await window.electronAPI.deleteProject(id);
    if (res?.success) {
      notify.success(t.projects.deleteSuccess, t.projects.deleteSuccessDesc, 2000);
      setLoading(true);
      await fetchProjects();
      return;
    }
    notify.error(t.projects.deleteError, res?.error || t.projects.deleteErrorDesc, 5000);
  };

  const handleEditRequest = (e, project) => {
    e.stopPropagation();
    setEditTarget(project);
  };

  const handleEditConfirm = async ({ modName, author }) => {
    if (!editTarget || !window.electronAPI) return;
    const projectData = {
      id: editTarget.id,
      name: modName,
      author,
      pakPath: editTarget.pakPath,
      translations: { name: modName, author },
    };
    const res = await window.electronAPI.saveProject(projectData);
    setEditTarget(null);
    if (res?.success) {
      notify.success(t.projects.editSuccess, t.projects.editUpdated(modName), 2500);
      await fetchProjects();
    } else {
      notify.error(t.projects.editError, t.projects.editErrorDesc, 4000);
    }
  };

  // Merge real projects with example project for tutorial display
  const displayProjects = useMemo(() => {
    if (exampleProject && projects.length === 0) return [exampleProject];
    return projects;
  }, [projects, exampleProject]);

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-surface-0 min-h-0">
      <PageBackground />

      {/* Profile button — morphs into compact user card when clicked */}
      <div className="absolute z-30 top-5 left-6" data-tutorial="profile">
        {/* Ghost div: always holds the final expanded dimensions so TutorialOverlay
            can target it instantly (no delay needed while the real panel animates open) */}
        <div
          data-tutorial="profile-full"
          className="absolute top-0 left-0 pointer-events-none"
          style={{ width: '320px', height: auth.isLoggedIn ? '482px' : '262px' }}
        />
        {/* Morphing container: icon → card header */}
        <div
          className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl"
          style={{
            width: isProfileExpanded ? '320px' : '40px',
            height: isProfileExpanded ? '64px' : '40px',
            transition: 'width 500ms cubic-bezier(0.4,0,0.2,1), height 500ms cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {/* Icon state (closed) */}
          <button
            onClick={handleToggleProfile}
            title={t.projects.settingsTitle}
            className="absolute inset-0 flex items-center justify-center hover:bg-white/[0.03] active:scale-[0.94] transition-colors duration-200"
            style={{
              opacity: isProfileExpanded ? 0 : 1,
              pointerEvents: isProfileExpanded ? 'none' : 'auto',
              transition: 'opacity 250ms cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {/* Wrapper positions the status dot relative to the avatar, inside overflow-hidden */}
            <div className="relative">
              {auth.user?.avatar ? (
                <img src={auth.user.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <User className={`w-5 h-5 ${auth.isLoggedIn ? 'text-zinc-400' : 'text-zinc-500'}`} />
              )}
              {auth.isLoggedIn && (
                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-0 ${(TIER_COLORS[auth.tier] || TIER_COLORS.guest).dot}`} />
              )}
            </div>
          </button>

          {/* Card header state (open) */}
          <button
            onClick={handleToggleProfile}
            className="absolute inset-0 px-3 flex items-center justify-between"
            style={{
              opacity: isProfileExpanded ? 1 : 0,
              pointerEvents: isProfileExpanded ? 'auto' : 'none',
              transition: 'opacity 250ms cubic-bezier(0.4,0,0.2,1)',
              transitionDelay: isProfileExpanded ? '200ms' : '0ms',
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              {auth.user?.avatar ? (
                <img src={auth.user.avatar} alt="" className="w-9 h-9 rounded-full ring-2 ring-white/[0.08] shrink-0 object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-zinc-500" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-zinc-100 truncate">
                  {auth.isLoggedIn ? (auth.user?.displayName || auth.user?.username) : t.tiers.guest}
                </p>
                {auth.isLoggedIn && <TierBadge tier={auth.tier} size="sm" />}
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-zinc-500 shrink-0" />
          </button>
        </div>

        {/* Expanded profile content — slides down below card */}
        <div
          className="overflow-hidden transition-all duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{
            maxHeight: isProfileExpanded ? '600px' : '0px',
            opacity: isProfileExpanded ? 1 : 0,
            marginTop: isProfileExpanded ? '8px' : '0px',
          }}
        >
          <div className="w-[320px] rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-5 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
            <ExpandedProfileContent isVisible={isProfileExpanded} />
          </div>
        </div>
      </div>

      {/* Top-right buttons — about + settings */}
      <div className="absolute top-5 right-6 z-30 flex items-center gap-2" data-tutorial="top-buttons">
        {onOpenHome && (
          <button
            onClick={onOpenHome}
            title={t.projects.aboutApp}
            className="group flex items-center justify-center w-10 h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:border-white/[0.16] hover:bg-white/[0.06] active:scale-[0.95] transition-all duration-200"
          >
            <Info className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 transition-colors duration-200" />
          </button>
        )}
        {onSettingsOpen && (
          <button
            onClick={onSettingsOpen}
            title="Настройки"
            className="group flex items-center justify-center w-10 h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:border-white/[0.16] hover:bg-white/[0.06] active:scale-[0.95] transition-all duration-200"
          >
            <Settings className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 transition-all duration-500 group-hover:rotate-90" />
          </button>
        )}
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col items-center px-10 pt-16 pb-20 w-full max-w-[1100px] mx-auto">
          <HeroSection />
          <div data-tutorial="dropzone">
            <DropZone onClickOpen={onSelectFile} onFileDrop={onFileDrop} />
          </div>
          <div data-tutorial="projects-section">
          <ProjectsSeparator count={displayProjects.length} loading={loading} />

          <div className="w-full start-fade-in" style={{ animationDelay: '180ms' }}>
            {loading ? (
              <LoadingState />
            ) : displayProjects.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-[220px]">
                {displayProjects.map((p, i) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    index={i}
                    onLoad={p.id === '__tutorial_example__' ? () => {} : onLoadProject}
                    onDelete={p.id === '__tutorial_example__' ? () => {} : handleDeleteRequest}
                    onEdit={p.id === '__tutorial_example__' ? () => {} : handleEditRequest}
                  />
                ))}
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
      <Footer />

      {deleteTarget && (
        <DeleteConfirmModal
          project={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <ProjectEditModal
        isOpen={!!editTarget}
        project={editTarget}
        existingProjectNames={projects.map((p) => p.name)}
        onConfirm={handleEditConfirm}
        onCancel={() => setEditTarget(null)}
      />

      {showTutorial && (
        <TutorialOverlay
          id="startpage"
          steps={[
            { target: 'dropzone',              title: t.tutorialStartPage?.stepDrop?.title          || 'Drop Zone',       description: t.tutorialStartPage?.stepDrop?.desc          || 'Drag & drop a .pak, .zip, or .rar file here to start translating.', padding: 8, borderRadius: 20 },
            { target: 'projects-section',      title: t.tutorialStartPage?.stepProjects?.title      || 'Your Projects',   description: t.tutorialStartPage?.stepProjects?.desc      || 'Recent projects appear here. Click any card to continue translating.', padding: 8, borderRadius: 16 },
            { target: 'profile-full',            title: t.tutorialStartPage?.stepProfile?.title       || 'Profile',         description: t.tutorialStartPage?.stepProfile?.desc       || 'Manage your account, sign in, or check subscription status.', padding: 6, borderRadius: 16 },
            { target: 'titlebar-notifications', title: t.tutorialStartPage?.stepNotifications?.title || 'Notifications',  description: t.tutorialStartPage?.stepNotifications?.desc || 'All important events appear here.', padding: 6, borderRadius: 12 },
            { target: 'top-buttons',           title: t.tutorialStartPage?.stepButtons?.title       || 'Quick Actions',   description: t.tutorialStartPage?.stepButtons?.desc       || 'Open app info or jump into settings from here.', padding: 6, borderRadius: 16 },
          ]}
          onBeforeStep={handleBeforeStep}
          onComplete={handleTutorialComplete}
          onDismiss={() => { setShowTutorial(false); setExampleProject(null); setIsProfileExpanded(false); }}
        />
      )}
    </div>
  );
}
