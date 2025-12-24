# Docker Build Fix Plan

## Problem
The Docker build fails with an "Unterminated regular expression" error in `frontend/src/pages/Organizations/OrganizationForm.jsx` at line 166.

## Root Cause
The file contains an extra closing `</div>` tag on line 166 that has no corresponding opening tag. This causes the esbuild parser to fail during the frontend build step.

## Current JSX Structure Analysis

The file has the following structure:
- Line 47: Opening `<div>` (main container) with className "bg-theme-bg-secondary..."
- Line 50: Opening `<div>` (header container)
- Line 60: Closing `</div>` (header container)
- Line 62: Opening `<form>`
- Lines 63-163: Form content with various nested divs
- Line 164: Closing `</form>`
- Line 165: Closing `</div>` (main container)
- Line 166: **EXTRA** `</div>` (causes the error)
- Line 167: Closing `</div>` (function return)

The extra `</div>` on line 166 is the culprit.

## Fix Steps

### 1. Remove the extra closing div tag
**File:** `frontend/src/pages/Organizations/OrganizationForm.jsx`
**Action:** Delete line 166 which contains only `</div>`

Before:
```jsx
        </form>
      </div>
    </div>
  );
}
```

After:
```jsx
        </form>
      </div>
  );
}
```

### 2. Verification
After applying the fix, verify:
- JSX tags are properly balanced
- No other syntax errors in the file
- Frontend builds successfully

## Expected Outcome
After applying this fix:
- The esbuild transformation will complete successfully
- The Docker build will proceed without errors
- The frontend application will be built and deployed successfully

## Related Files
- `frontend/src/pages/Organizations/OrganizationForm.jsx` - The file with the syntax error
- `docker/Dockerfile` - The Docker build configuration
- `frontend/package.json` - Frontend dependencies and build scripts
