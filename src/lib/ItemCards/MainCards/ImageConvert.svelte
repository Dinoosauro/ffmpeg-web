<script>
    import { GetImage } from "../../../ts/ImageHandler";
    import { getLang } from "../../../ts/LanguageAdapt";
    import ConversionOptions from "../../../ts/TabOptions/ConversionOptions";
    import EncoderInfo from "../../../ts/TabOptions/EncoderInfo";
    import { imageFormatSelected } from "../../../ts/Writables";
    import AdaptiveAsset from "../../UIElements/AdaptiveAsset.svelte";
    import Chip from "../../UIElements/ChipElements/Chip.svelte";
    import ChipContainer from "../../UIElements/ChipElements/ChipContainer.svelte";
</script>

<div class="flex hcenter wcenter" style="gap: 10px">
    <AdaptiveAsset asset="image"></AdaptiveAsset>
    <h2>{getLang("Convert image(s):")}</h2>
</div>
<p>
    {getLang(
        "You can convert images to various output formats. You can apply the same filters as the video part",
    )}
</p>
<br />
<p>{getLang("Image output format:")}</p>
<ChipContainer>
    <Chip
        selectionItems={Array.from(EncoderInfo.image).map((item) => {
            return {
                id: item[0],
                display: `${item[1].displayName}${item[1].extension !== "!" ? ` (.${item[1].extension})` : ""}`,
                selected: item[0] === ConversionOptions.videoTypeSelected,
            };
        })}
        on:userSelection={({ detail }) => {
            ConversionOptions.imageTypeSelected = detail;
            imageFormatSelected.set(detail);
        }}
    ></Chip>
</ChipContainer>
