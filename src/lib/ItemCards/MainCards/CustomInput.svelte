<script>
    import { GetImage } from "../../../ts/ImageHandler";
    import { getLang } from "../../../ts/LanguageAdapt";
    import InputOptions from "../../../ts/TabOptions/InputOptions";
    import OptionsPicker from "../../OptionsPicker.svelte";
    import AdaptiveAsset from "../../UIElements/AdaptiveAsset.svelte";
</script>

<div class="flex hcenter wcenter" style="gap: 10px">
    <AdaptiveAsset asset="windowconsole"></AdaptiveAsset>
    <h2>{getLang("Custom input:")}</h2>
</div>
<p>
    {getLang(
        `Write an argument in the textbox below. Then, click "Add" or press "Tab" to add it as an argument. Click on each argument to delete it.`,
    )}
    <br /><br />
    {getLang("You can also add")} <code>$input[number]</code>, {getLang(
        "that'll be automatically replaced with the file name, and",
    )} <code>$dollar</code>
    {getLang("to add a dollar sign.")}
</p>
<br />
<OptionsPicker arr="input"></OptionsPicker>
