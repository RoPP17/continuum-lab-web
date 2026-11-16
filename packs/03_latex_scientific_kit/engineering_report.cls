% =============================================================================
% ENGINEERING REPORT DOCUMENT CLASS — FORMATO TECNICO SOBRIO
% =============================================================================
\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{engineering_report}[2026/11/01 v1.0 Clase Editorial de Informes Tecnicos]

\DeclareOption{a4paper}{\PassOptionsToClass{a4paper}{article}}
\DeclareOption{letterpaper}{\PassOptionsToClass{letterpaper}{article}}
\DeclareOption{10pt}{\PassOptionsToClass{10pt}{article}}
\DeclareOption{11pt}{\PassOptionsToClass{11pt}{article}}
\DeclareOption*{\PassOptionsToClass{\CurrentOption}{article}}

\ExecuteOptions{11pt,a4paper}
\ProcessOptions\relax

\LoadClass{article}

\RequirePackage[
    a4paper,
    top=3.0cm,
    bottom=2.4cm,
    left=2.2cm,
    right=2.2cm,
    headheight=32pt,
    headsep=16pt,
    footskip=1.0cm
]{geometry}

\RequirePackage{engineering_theme}
\endinput
