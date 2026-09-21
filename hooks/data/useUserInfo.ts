import { directus } from "@/utils/directus";
import { readItems, readMe, readUsers } from "@directus/sdk";
import { EnaleiaUser } from "@/types/user";
import { useEffect, useState } from "react";

export function useUserInfo() {
  const [state, setState] = useState<{
    data: EnaleiaUser | null;
    isLoading: boolean;
    error: Error | null;
  }>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchUserInfo = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const token = await directus.getToken();
      if (!token) throw new Error("No token found");

      // First get basic user info
      const basicUserData = await directus.request(readMe());
      if (!basicUserData) throw new Error("No user data found");

      // Then get detailed user info including company
      const detailedUserData = await directus.request(
        readUsers({
          fields: [
            "id",
            "first_name",
            "last_name",
            "email",
            "Company",
            "Country_assign.countries_country_id.country_id",
            "Country_assign.countries_country_id.country_name",
          ],
          filter: {
            id: {
              _eq: basicUserData.id,
            },
          },
          limit: 1,
        })
      );

      if (!detailedUserData?.[0])
        throw new Error("Failed to fetch user details");

      const freshData: EnaleiaUser = {
        ...detailedUserData[0],
        token,
      };

      setState({ data: freshData, isLoading: false, error: null });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error
            : new Error("Failed to fetch user info"),
        isLoading: false,
      }));
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  return {
    ...state,
    refetch: fetchUserInfo,
  };
}
